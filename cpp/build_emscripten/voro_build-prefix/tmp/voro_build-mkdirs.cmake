# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION ${CMAKE_VERSION}) # this file comes with cmake

# If CMAKE_DISABLE_SOURCE_CHANGES is set to true and the source directory is an
# existing directory in our source tree, calling file(MAKE_DIRECTORY) on it
# would cause a fatal error, even though it would be a no-op.
if(NOT EXISTS "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build")
  file(MAKE_DIRECTORY "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build")
endif()
file(MAKE_DIRECTORY
  "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build-build"
  "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix"
  "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/tmp"
  "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build-stamp"
  "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src"
  "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build-stamp"
)

set(configSubDirs )
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/voro_build-prefix/src/voro_build-stamp${cfgdir}") # cfgdir has leading slash
endif()
