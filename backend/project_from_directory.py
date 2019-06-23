#!/usr/bin/env python

import sys
import rendering.serializers

serializer = rendering.serializers.ProjectFromDirectorySerializer(data={
    'owner': 'eulertour',
    'name': 'default',
    'directory': '/srv/data/user/eulertour/projects/default',
    'shared': False,
})

serializer.is_valid(raise_exception=True)
serializer.save()
