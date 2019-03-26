#!/usr/bin/python3.7

import os
import shlex
import subprocess

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

    # ## get container
    # container = "c1"

    # # mount manim
    # proc = subprocess.Popen([
    #         "lxc", "config", "device", "add", container, "manim", "disk",
    #         f"source={manim_path}",
    #         "path=/root/manim",
    #         "readonly=true",
    #     ],
    #     stdin=subprocess.PIPE,
    #     stdout=subprocess.PIPE,
    #     stderr=subprocess.PIPE,
    # )
    # err = proc.stderr.read()
    # if err:
    #     print(err)

    # # mount project
    # proc = subprocess.Popen([
    #         "lxc", "config", "device", "add", container, "project", "disk",
    #         f"source={project_path}",
    #         "path=/root/project",
    #     ],
    #     stdin=subprocess.PIPE,
    #     stdout=subprocess.PIPE,
    #     stderr=subprocess.PIPE,
    # )
    # err = proc.stderr.read()
    # if err:
    #     print(err)

    # devices = subprocess.check_output([
    #     "lxc", "config", "device", "list", container
    # ]).split()
    # if len(devices) != 2:
    #     print("some mounts failed")

    args = [
            "docker", "run", "--rm",
            "--cpuset-cpus", "0",
            "--memory", "500m",
            "--stop-timeout", "60",
            "--network", "none",
            "-v", f"{manim_path}:/root/manim:ro",
            "-v", f"{project_path}:/root/project",
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
    out = out.decode("utf-8")
    err = err.decode("utf-8")

    # remove warning about swap memory
    if err.startswith('WARNING'):
        err = '\n'.join(err.split('\n')[1:])

    info["returncode"] = proc.returncode
    info["stderr"] = err
    info["stdout"] = out

    # # unmount user files from container
    # for device in devices:
    #     subprocess.run([
    #         "lxc", "config", "device", "remove", container, device,
    #     ])

    return info
