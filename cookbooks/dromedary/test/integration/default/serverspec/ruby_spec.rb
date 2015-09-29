require 'serverspec'

set :backend, :exec

describe package('ruby') do 
  it { should be_installed }
end

describe command('which ruby') do
  its(:stdout) { should match /\/bin\/ruby/ }
end

describe command('ruby -v') do
  its(:stdout) { should match /2\.0/ }
end
