from lammps_logfile import File
from lammps_logfile import running_mean
import argparse
import matplotlib.pyplot as plt

def get_parser():
    parser = argparse.ArgumentParser(description="Plot contents from lammps log files")
    parser.add_argument("input_file", type=str, help="Lammps log file containing thermo output from lammps simulation.")
    parser.add_argument("-x", type=str, default="Time", help="Data to plot on the first axis")
    parser.add_argument("-y", type=str, nargs="+", help="Data to plot on the second axis. You can supply several names to get several plot lines in the same figure.")
    parser.add_argument("-a", "--running_average", type=int, default=1, help="Optionally average over this many log entries with a running average. Some thermo properties fluctuate wildly, and often we are interested in te running average of properties like temperature and pressure.")
    return parser

def run():
    args = get_parser().parse_args()
    log = File(args.input_file)
    x = log.get(args.x)
    print(x)
    if args.running_average >= 2:    
            x = running_mean(x, args.running_average)
    for y in args.y:
        data = log.get(y)
        print(data)
        if args.running_average >= 2:    
            data = running_mean(data, args.running_average)

        plt.plot(x, data, label=y)
    plt.legend()
    plt.show()
    
