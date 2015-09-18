require 'serverspec'

set :backend, :exec

describe command('/usr/local/bin/node -v') do
  its(:stdout) { should match /v0\.12\.7/ }
end

describe command('/usr/local/bin/npm -v') do
  its(:stdout) { should match /2\.11\.3/ }
end

describe command('/usr/local/bin/npm list --depth=0 -g 2> /dev/null | grep forever@') do
  its(:stdout) { should match /0\.15\.1/ }
end

