#!/usr/bin/python3.7

import os
import shlex
import subprocess

from manimlab_api import settings

def render_scene(
        input_filename,
        input_scene,
        manim_path,
        project_path,
    ):
    # render the video
    # TODO: factor this into a function
    # TODO: error checking is for squares
    info = {"scene": input_scene}

    ## get container
    container = "c1"

    # mount manim
    proc = subprocess.Popen([
            "lxc", "config", "device", "add", container, "manim", "disk",
            f"source={manim_path}",
            "path=/root/manim",
            "readonly=true",
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    err = proc.stderr.read()
    if err:
        print(err)

    # mount project
    proc = subprocess.Popen([
            "lxc", "config", "device", "add", container, "project", "disk",
            f"source={project_path}",
            "path=/root/project",
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    err = proc.stderr.read()
    if err:
        print(err)

    devices = subprocess.check_output([
        "lxc", "config", "device", "list", container
    ]).split()
    if len(devices) != 2:
        print("some mounts failed")

    args = [
            "lxc", "exec", container, "--",
            "docker", "run",
            "-v", "/root/manim:/root/manim",
            "-v", "/root/project:/root/project",
            "-e", "MEDIA_DIR=/root/project",
            "-e", "FILE_DIR=/root/project",
            "-e", "PYTHONPATH=/root/manim",
            "eulertour/manim:latest",
            "-c", "umask 002 && cd project/source && python3 -m manim " +
                  f"{shlex.quote(input_filename)} " +
                  f"{shlex.quote(input_scene)} -pl",
    ]
    # print(" ".join(args))
    # breakpoint(context=9)

    # can't this be subprocess.run(capture_output=True)?
    proc = subprocess.Popen(args,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    out, err = proc.communicate()

    info["returncode"] = proc.returncode
    info["stderr"] = err.decode("utf-8")
    info["stdout"] = out.decode("utf-8")

    # unmount user files from container
    for device in devices:
        subprocess.run([
            "lxc", "config", "device", "remove", container, device,
        ])

    return info
