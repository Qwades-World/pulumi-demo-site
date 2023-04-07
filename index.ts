import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const group = new aws.ec2.SecurityGroup("web-sg", {
  description: "Enable HTTP and SSH access",
  ingress: [
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["8.23.69.7/32"] },
  ],
  egress: [
    {
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      ipv6CidrBlocks: ["::/0"],
    },
  ],
});

const server = new aws.ec2.Instance("web-server", {
  ami: "ami-6869aa05",
  instanceType: "t2.micro",
  keyName: "deployer-qwade",
  vpcSecurityGroupIds: [group.name], // reference the security group resource above
});

export const instanceId = server.id;

const s3bucket = new aws.s3.Bucket("lb-01-logs", {
  acl: "private",
  tags: {
    Environment: "Dev",
    Name: "LB-01 Logs",
  },
});

export const s3bucketName = s3bucket.bucket;

const lb = new aws.elb.LoadBalancer("lb-01", {
  availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
  //accessLogs: {
  //  bucket: s3bucketName,
  //  bucketPrefix: "lb-01",
  //  interval: 60,
  //},
  listeners: [
    {
      instancePort: 8000,
      instanceProtocol: "http",
      lbPort: 80,
      lbProtocol: "http",
    },
    {
      instancePort: 8000,
      instanceProtocol: "http",
      lbPort: 443,
      lbProtocol: "https",
      sslCertificateId:
        "arn:aws:acm:us-east-1:758478930676:certificate/ac956acb-a1d6-4161-aef3-5293e3231527",
    },
  ],
  healthCheck: {
    healthyThreshold: 2,
    unhealthyThreshold: 2,
    timeout: 3,
    target: "HTTP:8000/",
    interval: 30,
  },
  instances: [instanceId],
  crossZoneLoadBalancing: true,
  idleTimeout: 400,
  connectionDraining: true,
  connectionDrainingTimeout: 400,
  tags: {
    Name: "web-server-lb-01",
  },
});

export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
export const securityGroupId = group.name;
export const keyName = server.keyName;
export const lbName = lb.name;
