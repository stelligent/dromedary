require 'aws-sdk'

describe('dromedary_security_group') do
  it 'will allow all traffic on 8080' do
    ec2 = Aws::EC2::Client.new(region: 'us-east-1')
    sg = ENV["dromedary_security_group"]

    expect(sg).to be

    group = ec2.describe_security_groups(filters: [{name: "group-id", values: [ sg ], }, ]).security_groups.first

    eightyeighty = group.ip_permissions.select do |perm|
      perm.from_port == 8080
    end

    expect(eightyeighty).to be
    expect(eightyeighty.size).to eq 1

    expect(eightyeighty.first.ip_ranges).to be
    expect(eightyeighty.first.ip_ranges.size).to eq 1

    cidr = eightyeighty.first.ip_ranges.first.cidr_ip

    expect(cidr).to eq "0.0.0.0/0"
  end 
end