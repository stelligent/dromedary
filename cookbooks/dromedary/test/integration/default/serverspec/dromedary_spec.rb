require 'serverspec'

set :backend, :exec

describe file('/dromedary') do
  it { should be_directory }
end

describe file('/dromedary/app.js') do
  it { should be_a_file }
end

describe port(8080) do
  it { should be_listening }
end

describe command("/usr/local/bin/forever list") do
  its(:stdout) { should match /dromedary\/app.js/ }
end
