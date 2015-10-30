require 'cucumber'
require 'rspec'
require 'aws-sdk'

cfn = Aws::CloudFormation::Client.new
s3 = Aws::S3::Client.new
environment_file = "#{ENV["ENVFILE"]}"

Given(/^I am the bootstrapping instance$/) do
  bootstrapper = %x[/opt/aws/bin/ec2-metadata | grep bootstrapper]
  expect(bootstrapper).to_not be_nil
end

When(/^I have finished bootstrapping Dromedary teardown$/) do
  expect(File.file?(environment_file)).to be false
end

Then(/^I should see a "([^"]*)" cloudformation stack with status "([^"]*)"$/) do |arg1, arg2|
  stack_status = cfn.describe_stacks(:stack_name => "#{ENV["PROD"]}-#{arg1}").stacks[0].stack_status
  expect(stack_status).to eq(arg2)
end

Then(/^I should not see a "([^"]*)" cloudformation stack$/) do |arg1|
  expect{cfn.describe_stacks(:stack_name => "#{ENV["PROD"]}-#{arg1}")}.to raise_error(Aws::CloudFormation::Errors::ValidationError)
end

Then(/^I should no longer have an environment file from the bootstrapper$/) do
  expect(File.file?(environment_file)).to be false
end

When(/^I have finished bootstrapping Dromedary$/) do
  expect(File.file?(environment_file)).to be true
end

Then(/^I should see the dromedary s3 bucket created$/) do
  bucket = s3.head_bucket({ bucket: "dromedary-#{ENV["ACCTID"]}" })
  expect(bucket).to be_empty
end

Then(/^I should have an environment file from the bootstrapper$/) do
  expect(File.file?(environment_file)).to be true
end

Then(/^the bootstrapping instance should be waiting to self\-terminate$/) do
  sleeping = %x[ps aux | grep 'sleep\ ' | wc -l]
  expect(sleeping.to_i).to be >= 2
end