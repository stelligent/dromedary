#
# Cookbook Name:: dromedary
# Recipe:: default
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

include_recipe 'dromedary::nginx_config'
# include_recipe 'dromedary::ssl_nginx_config'

include_recipe 'dromedary::install_dromedary'
