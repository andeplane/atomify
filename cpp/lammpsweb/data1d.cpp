#include "data1d.h"

void Data1D::add(float x, float y) {
  xValues.push_back(x);
  yValues.push_back(y);
}

void Data1D::clear() {
  xValues.clear();
  yValues.clear();
}