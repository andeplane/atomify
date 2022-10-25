#ifndef ATOMIFY_FIX_H
#define ATOMIFY_FIX_H
#include <string>

enum FixType {
  FixAveChunk,
  FixAveHisto,
  FixAveTime,
  FixOther
};


struct Fix {
  std::string m_name;
  FixType m_type;
  std::string getName();
  int getType();
};

#endif