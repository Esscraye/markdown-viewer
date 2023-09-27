#!/bin/bash

# set current working directory to directory of the shell script
cd "$(dirname "$0")"

curl https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.1/css/bootstrap.min.css --output ../../vendor/bootstrap.min.css
