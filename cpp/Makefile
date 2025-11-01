CXX = emcc
MAXMEMORY = 512MB

LAMMPS_SOURCE := $(wildcard lammps/src/*.cpp)
LAMMPS_SOURCE := $(filter-out lammps/src/main.cpp, $(LAMMPS_SOURCE))
LAMMPS_OBJ_FILES := $(addprefix obj/,$(notdir $(LAMMPS_SOURCE:.cpp=.o)))
LAMMPSWEB_FILES := atomify_compute atomify_modify atomify_fix atomify_variable fix_atomify lammpsweb data1d

#LD_FLAGS := -O1 --pre-js locateFile.js --no-entry -gsource-map --source-map-base="http://localhost:3000/atomify/" -lembind
#CC_FLAGS := -O0 -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL -gsource-map # -DNDEBUG
LD_FLAGS := -Oz --pre-js locateFile.js --no-entry -lembind
CC_FLAGS := -Oz -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL -s NO_DISABLE_EXCEPTION_CATCHING=1 -DCOLVARS_LAMMPS
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
$(foreach file,$(LAMMPSWEB_FILES),obj/$(file).o): obj/%.o: lammpsweb/%.cpp lammpsweb/%.h
	$(CXX) $(CC_FLAGS) $(INCLUDE_FLAGS) -c -o $@ lammps/src/$*.cpp

clean:
	rm lammps.mjs; rm lammps.wasm; rm obj/*