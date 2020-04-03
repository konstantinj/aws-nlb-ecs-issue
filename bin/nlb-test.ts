#!/usr/bin/env node
import {App} from '@aws-cdk/core'
import {NlbTestFailingStack} from '../lib/nlb-test-failing-stack'
import {NlbTestWorkingStack} from '../lib/nlb-test-working-stack'

const app = new App()
new NlbTestFailingStack(app, 'nlb-test-failing', {env: {account: process.env.ACCOUNT, region: process.env.REGION}})
new NlbTestWorkingStack(app, 'nlb-test-working', {env: {account: process.env.ACCOUNT, region: process.env.REGION}})
