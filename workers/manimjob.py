#!/usr/bin/python3.7

import collections
import os
import shlex
import subprocess

RESOLUTION_DICT = collections.defaultdict(
    lambda: "--low_quality", {
        "1440p": "",
        "1080p": "--high_quality",
        "720p": "--medium_quality",
        "480p": "--low_quality",
    }
)

def render_scene(
        input_filename,
        input_scene,
        input_resolution,
        manim_path,
        project_path,
    ):
    # render the video
    # TODO: factor this into a function
    # TODO: error checking is for squares
    info = {"scene": input_scene}

    # TODO: pass this in correctly
    args = [
            "docker", "run",
            "--rm",
            "--network", "none",
            "-v", f"{project_path}:/root/project",
            "-e", "MEDIA_DIR=/root/project",
            "-e", "FILE_DIR=/root/project",
            "manim",
            "-c",
            "umask 002 && " +
            "cd /root/project/source && " +
            "manim " + f"{shlex.quote(input_filename)} " +
                       f"{shlex.quote(input_scene)} " +
                       RESOLUTION_DICT[input_resolution],
    ]
    # print(" ".join(args))
    # import sys
    # print(" ".join(args), file=sys.stderr)

    # can't this be subprocess.run(capture_output=True)?
    proc = subprocess.Popen(args,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    out, err = proc.communicate()
    out = out.decode("utf-8")
    err = err.decode("utf-8")

    # remove warning about swap memory
    if err.startswith('WARNING'):
        err = '\n'.join(err.split('\n')[1:])

    info["returncode"] = proc.returncode
    info["stderr"] = err
    info["stdout"] = out

    return info
