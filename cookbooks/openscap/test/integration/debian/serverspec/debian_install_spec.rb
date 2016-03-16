require 'spec_helper'

describe package('libopenscap8'), :debian do
  it { should be_installed }
end

describe file('/opt/ubuntu-scap'), :debian do
  it { should be_directory }
end
