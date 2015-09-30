#
# Cookbook Name:: dromedary
# Recipe:: default
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

<<<<<<< HEAD
include_recipe 'dromedary::nginx_config'
# include_recipe 'dromedary::ssl_nginx_config'
include_recipe 'dromedary::nodejs'
include_recipe 'dromedary::yum_packages'
=======
# include_recipe 'dromedary::nginx_config'
include_recipe 'dromedary::ssl_nginx_config'

include_recipe 'dromedary::install_dromedary'
>>>>>>> origin/master
