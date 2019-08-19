#!/bin/bash
SOURCE_DIR=$1
DEST_DIR=$2

if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters"
    exit 1
fi
echo "Tag: $TRAVIS_TAG"
echo "Branch:  $TRAVIS_BRANCH"
rsync -r --delete-after --quiet $SOURCE_DIR  mintui@mint.isi.edu:$DEST_DIR
exit $?	
