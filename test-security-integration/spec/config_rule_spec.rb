require 'aws-sdk'

describe('config_rule') do
  it 'has a status of COMPLIANT' do
    client = Aws::ConfigService::Client.new(region: 'us-east-1')

    #Get Config rules
    rules = client.describe_config_rules({
      config_rule_names: [],
      next_token: "",
    })

    #Get compliance status for each rule
    rules.each do |rule|
      comp = client.describe_compliance_by_config_rule({
        config_rule_names: [rule.config_rule_name],
        compliance_types: [],
        next_token: "",
      })
      expect(comp.compliance_type).to eq "COMPLIANT"
    end
  end
end
