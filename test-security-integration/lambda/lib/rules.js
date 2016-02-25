exports.getRules = function () {
    var aws = require('aws-sdk');
    var iam = new aws.IAM;
    return {
        "IAM": {
            "MFADevice": {
                test: function (user, configurator) {
                    var compliance = 'NON_COMPLIANT';
                    var params = {
                        "UserName": user.UserName
                    };
                    iam.listMFADevices(params, function (err, data) {
                        var responseData = {};
                        if (err) {
                            responseData = {Error: 'listMFADevices call failed'};
                            console.log(responseData.Error + ':\\n', err);
                        } else {
                            if (data.MFADevices.length >= 1) {
                                compliance = 'COMPLIANT';
                            }
                            console.log("compliance: " + compliance);
                            configurator.setConfig(compliance);
                        }
                    });
                }
            },
            "InlinePolicy": {
                test: function (user, configurator) {
                    var params = {
                        "UserName": user.UserName
                    };
                    iam.listUserPolicies(params, function (err, data) {
                        var compliance = "NON_COMPLIANT";
                        var responseData = {};
                        if (err) {
                            responseData = {Error: 'listUserPolicies call failed'};
                            console.log(responseData.Error + ':\\n', err);
                        } else {
                            if (data.PolicyNames.length === 0) {
                                compliance = "COMPLIANT";
                            }
                            console.log("compliance: " + compliance);
                            configurator.setConfig(compliance);
                        }
                    });
                }
            },
            "ManagedPolicy": {
                test: function (user, configurator) {
                    var params = {
                        "UserName": user.UserName
                    };
                    iam.listAttachedUserPolicies(params, function (err, data) {
                        console.log("attached policies:" + JSON.stringify(data.AttachedPolicies));
                        var compliance = 'NON_COMPLIANT';
                        var responseData = {};
                        if (err) {
                            responseData = {Error: 'listAttachedUserPolicies call failed'};
                            console.log("foo2:" + self.nonCompCnt);
                            console.log(responseData.Error + ':\\n', err);
                        } else {
                            if (data.AttachedPolicies.length === 0) {
                                compliance = 'COMPLIANT';
                            }
                            console.log("compliance: " + compliance);
                            configurator.setConfig(compliance);
                        }
                    })
                }
            },
            "Permission": {
                test: function (policy, configurator) {
                    //TODO - function not correct.  need to revise logic.
                    var compliance = 'NON_COMPLIANT';
                    var nonCompCnt = 0;
                    var params = {
                        "PolicyArn": policy.Arn,
                        "VersionId": policy.DefaultVersionId
                    };
                    iam.getPolicyVersion(params, function (err, data) {
                        var responseData = {};
                        if (err) {
                            responseData = {Error: 'getPolicyVersion call failed'};
                            console.log(responseData.Error + ':\\n', err);
                        }
                        else {
                            var policyDoc = JSON.parse(data.PolicyVersion.Document);
                            policyDoc.statements.forEach(function (item) {
                                if (item.Effect === "Allow") {
                                    if (item.Action === "*" || item.Resource === "*") {
                                        nonCompCnt++;
                                    }
                                }
                            })
                        }
                    });
                    compliance = nonCompCnt === 0 ? "COMPLIANT" : "NON_COMPLIANT";
                    console.log("compliance: " + compliance);
                    configurator.setConfig(compliance);
                }
            }
        },
        "EC2": {
            "CidrIngress": {
                test: function (secGrp, configurator) {
                    var compliance = undefined;
                    var nonCompCnt = 0;
                    var cidrRangeRegex = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$"
                    secGrp.IpPermissions.forEach(function (ipPerm) {
                        ipPerm.IpRanges.forEach(function (ipRange) {
                            //check if cidrIp is populated with a cidr or a security group
                            if (ipRange.CidrIp.search(cidrRangeRegex) !== -1) {
                                //if it's a cidr then make sure it's not open to the world
                                if (ipRange.CidrIp === "0.0.0.0/0") {
                                    nonCompCnt++;
                                }
                                //make sure it applies to a single host
                                if (ipRange.CidrIp.split("/")[1] !== "32") {
                                    nonCompCnt++;
                                }
                            }
                        });
                    });
                    compliance = nonCompCnt === 0 ? "COMPLIANT" : "NON_COMPLIANT";
                    console.log("compliance: " + compliance);
                    configurator.setConfig(compliance);
                }
            },
            "CidrEgress": {
                test: function (secGrp, configurator) {
                    var compliance = undefined;
                    var nonCompCnt = 0;
                    var cidrRangeRegex = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$"
                    secGrp.IpPermissionsEgress.forEach(function (ipPerm) {
                        ipPerm.IpRanges.forEach(function (ipRange) {
                            //check if cidrIp is populated with a cidr or a security group
                            if (ipRange.CidrIp.search(cidrRangeRegex) !== -1) {
                                //if it's a cidr then make sure it's not open to the world
                                if (ipRange.CidrIp === "0.0.0.0/0") {
                                    nonCompCnt++;
                                }
                                //make sure it applies to a single host
                                if (ipRange.CidrIp.split("/")[1] !== "32") {
                                    nonCompCnt++;
                                }
                            }
                        });
                    });
                    compliance = nonCompCnt === 0 ? "COMPLIANT" : "NON_COMPLIANT";
                    console.log("compliance: " + compliance);
                    configurator.setConfig(compliance);
                }
            }

        }
    }
};
