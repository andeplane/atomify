# Install script for directory: /Users/anderhaf/repos/atomify/atomify-main/cpp/lammps/lib/kokkos

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "/Users/anderhaf/.local")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Release")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "TRUE")
endif()

# Set path to fallback-tool for dependency-resolution.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "/opt/homebrew/opt/llvm/bin/llvm-objdump")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/core/cmake_install.cmake")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/containers/cmake_install.cmake")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/algorithms/cmake_install.cmake")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/simd/cmake_install.cmake")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/example/cmake_install.cmake")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/benchmarks/cmake_install.cmake")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos" TYPE FILE FILES
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosConfig.cmake"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosConfigCommon.cmake"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosConfigVersion.cmake"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  if(EXISTS "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos/KokkosTargets.cmake")
    file(DIFFERENT _cmake_export_file_changed FILES
         "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos/KokkosTargets.cmake"
         "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/CMakeFiles/Export/7c5c9398a7e290ebb35584c8631204e4/KokkosTargets.cmake")
    if(_cmake_export_file_changed)
      file(GLOB _cmake_old_config_files "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos/KokkosTargets-*.cmake")
      if(_cmake_old_config_files)
        string(REPLACE ";" ", " _cmake_old_config_files_text "${_cmake_old_config_files}")
        message(STATUS "Old export file \"$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos/KokkosTargets.cmake\" will be replaced.  Removing files [${_cmake_old_config_files_text}].")
        unset(_cmake_old_config_files_text)
        file(REMOVE ${_cmake_old_config_files})
      endif()
      unset(_cmake_old_config_files)
    endif()
    unset(_cmake_export_file_changed)
  endif()
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos" TYPE FILE FILES "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/CMakeFiles/Export/7c5c9398a7e290ebb35584c8631204e4/KokkosTargets.cmake")
  if(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ee][Aa][Ss][Ee])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/Kokkos" TYPE FILE FILES "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/CMakeFiles/Export/7c5c9398a7e290ebb35584c8631204e4/KokkosTargets-release.cmake")
  endif()
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/kokkos" TYPE FILE FILES "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosCore_config.h")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/bin" TYPE PROGRAM FILES
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/lammps/lib/kokkos/bin/nvcc_wrapper"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/lammps/lib/kokkos/bin/hpcbind"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/temp/kokkos_launch_compiler"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/kokkos" TYPE FILE FILES
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosCore_config.h"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosCore_Config_FwdBackend.hpp"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosCore_Config_SetupBackend.hpp"
    "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/KokkosCore_Config_DeclareBackend.hpp"
    )
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
if(CMAKE_INSTALL_LOCAL_ONLY)
  file(WRITE "/Users/anderhaf/repos/atomify/atomify-main/cpp/build_emscripten/lib/kokkos/install_local_manifest.txt"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
endif()
