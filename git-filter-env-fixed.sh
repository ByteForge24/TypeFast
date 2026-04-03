#!/bin/bash

START=1761935400
INTERVAL=24628

INDEX=$(git rev-list --reverse HEAD | nl | grep "$GIT_COMMIT" | awk '{print $1}')
INDEX=$((INDEX - 1))

TIMESTAMP=$(($START + ($INDEX * $INTERVAL)))

export GIT_AUTHOR_DATE="$TIMESTAMP +0530"
export GIT_COMMITTER_DATE="$TIMESTAMP +0530"
export GIT_AUTHOR_NAME="hkrishna8124"
export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
export GIT_COMMITTER_NAME="hkrishna8124"
export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
