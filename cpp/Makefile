CXX = emcc
MAXMEMORY = 512MB

LAMMPS_SOURCE := $(wildcard lammps/src/*.cpp)
LAMMPS_SOURCE := $(filter-out lammps/src/main.cpp, $(LAMMPS_SOURCE))
LAMMPS_OBJ_FILES := $(addprefix obj/,$(notdir $(LAMMPS_SOURCE:.cpp=.o)))

LD_FLAGS := -O1 --pre-js locateFile.js --no-entry 
CC_FLAGS := -O1 -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL # -DNDEBUG
INCLUDE_FLAGS := -Ilammps/src
SYMBOLS := --bind -s ENVIRONMENT='web' \
                  -s NO_DISABLE_EXCEPTION_CATCHING \
									-s ALLOW_MEMORY_GROWTH=1 \
									-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
									-s ASYNCIFY \
									-s MODULARIZE=1 \
									-s EXPORTED_RUNTIME_METHODS="['getValue', 'FS']" \
									-s EXPORT_NAME='createModule' \
									-s USE_ES6_IMPORT_META=0 \
									-s FORCE_FILESYSTEM=1
									# -s ASSERTIONS=1 

default: wasm
wasm: obj lammps.mjs

lammps.mjs: $(LAMMPS_OBJ_FILES)
	$(CXX) $(SYMBOLS) $(LD_FLAGS) -o $@ $^
	
obj:
	mkdir -p obj

obj/%.o: lammps/src/%.cpp
	$(CXX) $(SYMBOLS) $(CC_FLAGS) $(INCLUDE_FLAGS) -c -o $@ $<

clean:
	rm lammps.mjs; rm lammps.wasm; rm obj/*