require 'spec_helper'

describe package('openscap-utils'), :rhel do
  it { should be_installed }
end

describe package('scap-security-guide'), :rhel do
  it { should be_installed }
end

