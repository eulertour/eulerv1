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
        server_source_path,
        source_filepath,
        scene,
        server_video_path,
        server_tex_path,
        input_resolution,
    ):
    # render the video
    # TODO: factor this into a function
    # TODO: error checking is for squares
    info = {"scene": scene}

    # TODO: pass this in correctly
    args = [
            "docker", "run",
            "--rm",
            "--network", "none",
            "-v", f"{server_source_path}:/root/source",
            "-v", f"{server_video_path}:/root/video",
            "-v", f"{server_tex_path}:/root/tex",
            "eulertour/manim:latest",
            "-c",
            "umask 002 && " +
            "cd /root/source && " +
            "manim "
                "--video_dir=/root/video "
                "--tex_dir=/root/tex "
                f"{shlex.quote(source_filepath)} "
                f"{shlex.quote(scene)} " +
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
