
#!/bin/bash

usage () {
  /bin/echo "Usage:  $0 -b Build the docker image"
  /bin/echo "           -p Push image to dockerhub"
  exit 2
}

IMAGE="gridappsd/viz"
TAG="${TRAVIS_BRANCH}"
TIMESTAMP=`date +'%y%m%d%H'`
GITHASH=`git log -1 --pretty=format:"%h"`

BUILD_VERSION="${TIMESTAMP}_${GITHASH}${TRAVIS_BRANCH:+:$TRAVIS_BRANCH}"

# parse options
while getopts bp option ; do
  case $option in
    b) # Pass gridappsd tag to docker-compose
      docker build --build-arg TIMESTAMP="${BUILD_VERSION}" -t ${IMAGE}:$TIMESTAMP .
      ;;
    p) # Pass gridappsd tag to docker-compose
      docker push ${IMAGE}:$TIMESTAMP
      [ -n "$TAG" ] && docker tag ${IMAGE}:$TIMESTAMP ${IMAGE}:$TAG
      [ -n "$TAG" ] && docker push ${IMAGE}:$TAG
      ;;
    *) # Print Usage
      usage
      ;;
  esac
done
shift `expr $OPTIND - 1`
