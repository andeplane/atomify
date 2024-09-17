import numpy as np 
import matplotlib 

def running_mean(data, N):
    """Calculate running mean of an array-like dataset.

    Parameters 
    --------------------
    :param data: The array 
    :type data: 1d array-like
    :param N: Width of the averaging window
    :type N: int 

    """
    
    data = np.asarray(data)
    if N == 1:
        return data
    else:
        retArray = np.zeros(data.size)*np.nan
        padL = int(N/2)
        padR = N-padL-1
        retArray[padL:-padR] = np.convolve(data, np.ones((N,))/N, mode='valid')
        return retArray 

def get_color_value(value, minValue, maxValue, cmap='viridis'):
    """Get color from colormap.

    Parameters
    -----------------
    :param value: Value used tpo get color from colormap
    :param minValue: Minimum value in colormap. Values below this value will saturate on the lower color of the colormap.
    :param maxValue: Maximum value in colormap. Values above this value will saturate on the upper color of the colormap.

    :returns: 4-vector containing colormap values. 

    This is useful if you are plotting data from several simulations, and want to color them based on some parameters changing between the simulations. For example, you may want the color to gradually change along a clormap as the temperature increases. 

    """
    diff = maxValue-minValue
    cmap = matplotlib.cm.get_cmap(cmap)
    rgba = cmap((value-minValue)/diff)
    return rgba

def get_matlab_color(i):
    """Get colors from matlabs standard color order. 

    Parameters
    -------------
    :param i: Index. Cycles with a period of 7, so calling with 1 returns the same color as calling with 8. 
    :type i: int 

    :returns: color as 3-vector 

    """
    colors = np.asarray([ [0, 0.447000000000000, 0.741000000000000],
                          [0.850000000000000, 0.325000000000000, 0.098000000000000],
                          [0.929000000000000, 0.694000000000000, 0.125000000000000],
                          [0.494000000000000, 0.184000000000000, 0.556000000000000],
                          [0.466000000000000, 0.674000000000000, 0.188000000000000],
                          [0.301000000000000, 0.745000000000000, 0.933000000000000],
                          [0.635000000000000, 0.078000000000000, 0.184000000000000]])
    return colors[ i%len(colors) ]
