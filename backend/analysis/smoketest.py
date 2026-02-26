import subprocess
def f(x):
    subprocess.run("echo " + x, shell=True)
