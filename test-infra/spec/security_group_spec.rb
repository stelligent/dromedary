require 'aws-sdk'

describe('dromedary_security_group') do
  it 'will not allow all traffic on 22' do
    ec2 = Aws::EC2::Client.new(region: 'us-east-1')
    sg = ENV["dromedary_security_group"]

    expect(sg).to be

    group = ec2.describe_security_groups(filters: [{name: "group-id", values: [ sg ], }, ]).security_groups.first

    twentytwo = group.ip_permissions.select do |perm|
      perm.from_port == 22
    end

    expect(twentytwo).to be
    expect(twentytwo.size).to eq 1

    expect(twentytwo.first.ip_ranges).to be
    expect(twentytwo.first.ip_ranges.size).to eq 1

    cidr = twentytwo.first.ip_ranges.first.cidr_ip

    expect(cidr).not_to eq "0.0.0.0/0"
  end 
end
