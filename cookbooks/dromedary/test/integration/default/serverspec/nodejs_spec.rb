require 'serverspec'

set :backend, :exec

describe package('nodejs') do 
  it { should be_installed }
end

describe command('which node') do
  its(:stdout) { should match /\/bin\/node/ }
end

describe command('node -v') do
  its(:stdout) { should match /v0\.10\.36/ }
end

describe command('npm -v') do
  its(:stdout) { should match /1\.3\.6/ }
end

describe command('npm list --depth=0 -g 2> /dev/null | grep forever@') do
  its(:stdout) { should match /0\.15\.1/ }
end

