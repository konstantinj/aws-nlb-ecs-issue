import {InstanceClass, InstanceSize, InstanceType, Peer, Port, Vpc} from '@aws-cdk/aws-ec2'
import {NetworkLoadBalancer, Protocol} from '@aws-cdk/aws-elasticloadbalancingv2'
import {Cluster, ContainerImage, EcsOptimizedImage} from '@aws-cdk/aws-ecs'
import {AutoScalingGroup, UpdateType} from '@aws-cdk/aws-autoscaling'
import {App, Duration, Stack, StackProps} from '@aws-cdk/core'
import {NetworkLoadBalancedEc2Service} from '@aws-cdk/aws-ecs-patterns'

export class NlbTestWorkingStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props)

        const vpc = Vpc.fromLookup(this, 'Vpc', {
            vpcName: 'skynet', // change this to your vpcname
        })

        const cluster = new Cluster(this, 'Cluster', {
            clusterName: this.stackName,
            vpc: vpc,
        })

        const autoScalingGroup = new AutoScalingGroup(this, 'AutoScalingGroup', {
            vpc: vpc,
            instanceType: InstanceType.of(InstanceClass.R5, InstanceSize.LARGE),
            machineImage: EcsOptimizedImage.amazonLinux2(),
            updateType: UpdateType.ROLLING_UPDATE,
            allowAllOutbound: true,
            desiredCapacity: 2,
            minCapacity: 2,
            maxCapacity: 2,
            keyName: 'delta', // change this to your ec2-keyname
            cooldown: Duration.seconds(30),
            spotPrice: '0.2',
        })
        autoScalingGroup.connections.allowFrom(Peer.anyIpv4(), Port.tcpRange(32768, 65535))
        autoScalingGroup.connections.allowFrom(Peer.ipv4('10.0.0.0/8'), Port.tcp(22))
        cluster.addAutoScalingGroup(autoScalingGroup)

        const nlb = new NetworkLoadBalancer(this, 'PrivateNLB', {
            vpc: vpc,
            internetFacing: false,
        })

        for (let port of [20001, 20002]) {
            let service = new NetworkLoadBalancedEc2Service(this, 'Service' + port, {
                publicLoadBalancer: true,
                memoryReservationMiB: 128,
                cluster: cluster,
                desiredCount: 1,
                taskImageOptions: {
                    image: ContainerImage.fromAsset('app/'),
                    containerPort: 80,
                    environment: {
                        CUSTOM_PORT: port.toString(),
                    }
                }
            })

            service.taskDefinition.defaultContainer?.addPortMappings({containerPort: 443})
            service.taskDefinition.defaultContainer?.addPortMappings({containerPort: port})

            service.targetGroup.configureHealthCheck({
                interval: Duration.seconds(10),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 2,
            })

            service.loadBalancer.addListener('443', {
                port: 443,
                protocol: Protocol.TCP
            }).addTargets('443', {
                port: 443,
                targets: [service.service.loadBalancerTarget({
                    containerName: service.taskDefinition.defaultContainer?.containerName!,
                    containerPort: 443,
                })]
            }).configureHealthCheck({
                interval: Duration.seconds(10),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 2,
            })

            nlb.addListener(port.toString(), {
                port: port,
                protocol: Protocol.TCP
            }).addTargets(port.toString(), {
                port: port,
                targets: [service.service.loadBalancerTarget({
                    containerName: service.taskDefinition.defaultContainer?.containerName!,
                    containerPort: port,
                })]
            }).configureHealthCheck({
                interval: Duration.seconds(10),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 2,
            })
        }
    }
}
