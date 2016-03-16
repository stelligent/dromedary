bash 'update the package repositories' do
  code <<-END
    apt-get update
  END
end

package 'libopenscap8'

package 'git'

bash 'install ubuntu-scap' do
  code <<-END
    cd /opt

    # hmmm - specific version to make this reproducible, or always go for the latest?
    git clone https://github.com/GovReady/ubuntu-scap.git
  END
  not_if { ::File.exists?('/opt/ubuntu-scap') }
end