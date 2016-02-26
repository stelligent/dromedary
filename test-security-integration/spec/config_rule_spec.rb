require 'aws-sdk'
require 'json'

describe('all_config_rules') do
  it 'have a status of COMPLIANT' do
    client = Aws::ConfigService::Client.new(region: 'us-east-1')
    s3 = Aws::S3::Client.new(region: 'us-east-1')

    #Get Config rules
    rules = client.describe_config_rules({
      config_rule_names: [],
      next_token: "",
    })


    rule_stats = Array.new
    fail_count = 0

    #Get compliance status for each rule
    rules.config_rules.each do |rule|
      comp = client.describe_compliance_by_config_rule({
        config_rule_names: [rule.config_rule_name],
        compliance_types: [],
        next_token: "",
      })
      comp_status = comp.compliance_by_config_rules[0].compliance.compliance_type
      comp_result = comp_status == "COMPLIANT" ? "PASS" : "FAIL"
      rule_stat = {"rule" => rule.config_rule_name, "status" => comp_status, "result" => comp_result}
      rule_stats.push(rule_stat)
      if comp_status != "COMPLIANT"
        fail_count = fail_count + 1
      end
    end
    rule_stats.each {|rule| puts "#{rule["rule"]} is #{rule["status"]}:  #{rule["result"]}" }
    status = fail_count == 0 ? "PASS" : "FAIL"
    rule_stats_output = {"result" => status, "results" => rule_stats}
    puts "cwd: #{Dir.pwd}"
    File.open("sec_int_test_results.json","w") do |f|
      f.write(rule_stats_output.to_json)
    end
    expect(status).to eq "PASS"
  end
end
