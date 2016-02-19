require 'aws-sdk'

describe('all_config_rules') do
  it 'have a status of COMPLIANT' do
    client = Aws::ConfigService::Client.new(region: 'us-east-1')

    #Get Config rules
    rules = client.describe_config_rules({
      config_rule_names: [],
      next_token: "",
    })

    rule_stats = Hash.new
    fail_count = 0

    #Get compliance status for each rule
    rules.config_rules.each do |rule|
      comp = client.describe_compliance_by_config_rule({
        config_rule_names: [rule.config_rule_name],
        compliance_types: [],
        next_token: "",
      })
      comp_status = comp.compliance_by_config_rules[0].compliance.compliance_type
      rule_stats[rule.config_rule_name] = comp_status
      if comp_status != "COMPLIANT"
        fail_count = fail_count + 1
      end
    end
    rule_stats.each {|key, value| puts "#{key} is #{value}:  #{value == "COMPLIANT" ? "PASS" : "FAIL"}" }
    expect(fail_count).to eq 0
  end
end
