require 'serverspec'

set :backend, :exec

# for some reason CodeDeploy doesn't work with the service matcher
describe command('service codedeploy-agent status') do
  its(:stdout) { should_not match /The AWS CodeDeploy agent is running as/ }
end
