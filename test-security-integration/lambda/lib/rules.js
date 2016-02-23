exports.getRules = function(){
  return {
    "IAM": {
      "MFADevices": function(mfaDevices){
        var compliance = 'NON_COMPLIANT';
        if (mfaDevices.length >= 1) {
          compliance = 'COMPLIANT';
        }
        return compliance;
      }
    },
    "EC2": {
      "CidrIngress": function(secGrp){
        var non_comp_cnt = 0;
        var cidrRangeRegex = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$"
        secGrp.IpPermissions.forEach(function(ipPerm){
          ipPerm.IpRanges.forEach(function(ipRange){
            //check if cidrIp is populated with a cidr or a security group
            if (ipRange.CidrIp.search(cidrRangeRegex) !== -1){
              //if it's a cidr then make sure it's not open to the world
              if (ipRange.CidrIp === "0.0.0.0/0"){
                non_comp_cnt++;
              }
              //make sure it applies to a single host
              if (ipRange.CidrIp.split("/")[1] !== "32"){
                non_comp_cnt++;
              }
            }
          });
        });
        return non_comp_cnt === 0 ? "COMPLIANT" : "NON_COMPLIANT";
      },
      "CidrEgress": function(secGrp){
        var non_comp_cnt = 0;
        var cidrRangeRegex = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$"
        secGrp.IpPermissionsEgress.forEach(function(ipPerm){
          ipPerm.IpRanges.forEach(function(ipRange){
            //check if cidrIp is populated with a cidr or a security group
            if (ipRange.CidrIp.search(cidrRangeRegex) !== -1){
              //if it's a cidr then make sure it's not open to the world
              if (ipRange.CidrIp === "0.0.0.0/0"){
                non_comp_cnt++;
              }
              //make sure it applies to a single host
              if (ipRange.CidrIp.split("/")[1] !== "32"){
                non_comp_cnt++;
              }
            }
          });
        });
        return non_comp_cnt === 0 ? "COMPLIANT" : "NON_COMPLIANT";
      }
    }
  }
}
