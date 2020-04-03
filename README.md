# AWS NLB ECS issue

This repo contains 2 CDK (https://github.com/aws/aws-cdk) stacks.

Both contain 2 ECS EC2 services with a single container that is opening 3 TCP ports, 80, 443 and a custom port. Each service has its own internet-facing NLB opening the ports 80 and 443. A third private NLB is attached to both services and is opening the custom port 20001 for service 1 and 20002 for service2.

On the working stack the private NLB is forwarding traffic from port 20001 to container port 20001 on service 1 and from port 20002 to container port 20002 on service 2. Both ports are reachable.

On the failing stack the private NLB is forwarding traffic from port 20001 to container port 20000 on service 1 and from port 20002 to container port 20000 on service 2. Only one of the ports is reachable at a time, most of the time both ports are unavailable.

It is not possible to set a custom healthcheck port. Cloudformation reports this error:

`The task definition is configured to use a dynamic host port, but the target group with targetGroupArn arn:aws:... has a health check port specified.`

## Deploy

`ACCOUNT=XXXXXXXXXXXX REGION=eu-west-1 cdk deploy nlb-test-failing`

`ACCOUNT=XXXXXXXXXXXX REGION=eu-west-1 cdk deploy nlb-test-working`