import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const group = new aws.ec2.SecurityGroup("web-sg", {
    description: "Enable HTTP and SSH access",
    ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }, { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["8.23.69.7/32"] }],
});

const server = new aws.ec2.Instance("web-server", {
    ami: "ami-6869aa05",
    instanceType: "t2.micro",
    keyName: "deployer-qwade",
    vpcSecurityGroupIds: [group.name], // reference the security group resource above
});

export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
export const securityGroupId = group.name;