CXX = emcc

LAMMPS_SOURCE := $(wildcard lammps/src/*.cpp)
LAMMPS_SOURCE := $(filter-out lammps/src/main.cpp, $(LAMMPS_SOURCE))
LAMMPS_OBJ_FILES := $(addprefix obj/,$(notdir $(LAMMPS_SOURCE:.cpp=.o)))
LAMMPSWEB_FILES := atomify_compute atomify_modify atomify_fix atomify_variable fix_atomify lammpsweb data1d

# Common flags shared between debug and release builds
LD_FLAGS_COMMON := --pre-js locateFile.js --no-entry -lembind
CC_FLAGS_COMMON := -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL -s NO_DISABLE_EXCEPTION_CATCHING=1 -DCOLVARS_LAMMPS

ifeq ($(DEBUG), 1)
  # Debug flags
  LD_FLAGS := -O1 -gsource-map --source-map-base="http://localhost:3000/atomify/" $(LD_FLAGS_COMMON)
  CC_FLAGS := -O0 -gsource-map $(CC_FLAGS_COMMON)
else
  # Release flags - maximum optimization
  LD_FLAGS := -Oz -flto $(LD_FLAGS_COMMON)
  CC_FLAGS := -Oz -DNDEBUG -flto $(CC_FLAGS_COMMON)
endif
INCLUDE_FLAGS := -Ilammps/src
SYMBOLS :=        -s ENVIRONMENT='web' \
									-s NO_DISABLE_EXCEPTION_CATCHING=1 \
									-s ALLOW_MEMORY_GROWTH=1 \
									-s ASYNCIFY \
									-s MODULARIZE=1 \
									-s EXPORTED_RUNTIME_METHODS="['getValue', 'FS', 'HEAP32', 'HEAPF32', 'HEAPF64']" \
									-s EXPORT_NAME='createModule' \
									-s FORCE_FILESYSTEM=1

default: wasm
wasm: obj lammps.mjs

lammps.mjs: $(LAMMPS_OBJ_FILES)
	$(CXX) $(SYMBOLS) $(LD_FLAGS) -o $@ $^
	
obj:
	mkdir -p obj

obj/%.o: lammps/src/%.cpp
	$(CXX) $(CC_FLAGS) $(INCLUDE_FLAGS) -c -o $@ $<

# Dependencies for lammpsweb files
$(foreach file,$(LAMMPSWEB_FILES),obj/$(file).o): obj/%.o: lammps/src/%.cpp lammps/src/%.h
	$(CXX) $(CC_FLAGS) $(INCLUDE_FLAGS) -c -o $@ lammps/src/$*.cpp

clean:
	rm -f lammps.mjs lammps.wasm $(LAMMPS_OBJ_FILES)