#ifndef DATA1D_H
#define DATA1D_H
#include <vector>
#include <string>
#include <limits>

struct Data1D {
  float xMin = std::numeric_limits<float>::max();
  float yMin = std::numeric_limits<float>::max();
  float xMax = std::numeric_limits<float>::min();
  float yMax = std::numeric_limits<float>::min();

  std::vector<float> xValues;
  std::vector<float> yValues;
  std::string label;
  long getXValuesPointer() { return reinterpret_cast<long>(xValues.data()); }
  long getYValuesPointer() { return reinterpret_cast<long>(yValues.data()); }
  std::string getLabel() { return label; }
  int getNumPoints() { return xValues.size(); }
  void add(float x, float y);
  void clear();
};

#endif