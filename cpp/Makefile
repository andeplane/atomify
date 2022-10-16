CXX = emcc
MAXMEMORY = 512MB

LAMMPS_SOURCE := $(wildcard lammps/src/*.cpp)
LAMMPS_SOURCE := $(filter-out lammps/src/main.cpp, $(LAMMPS_SOURCE))
LAMMPS_OBJ_FILES := $(addprefix obj/,$(notdir $(LAMMPS_SOURCE:.cpp=.o)))

#LD_FLAGS := -O1 --pre-js locateFile.js --no-entry -gsource-map --source-map-base="http://localhost:3000/atomify/" -lembind
#CC_FLAGS := -O0 -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL -gsource-map # -DNDEBUG
LD_FLAGS := -O2 --pre-js locateFile.js --no-entry -lembind
CC_FLAGS := -O2 -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL -s NO_DISABLE_EXCEPTION_CATCHING=1
INCLUDE_FLAGS := -Ilammps/src
SYMBOLS :=        -s ENVIRONMENT='web' \
									-s NO_DISABLE_EXCEPTION_CATCHING=1 \
									-s ALLOW_MEMORY_GROWTH=1 \
									-s ASYNCIFY \
									-s MODULARIZE=1 \
									-s EXPORTED_RUNTIME_METHODS="['getValue', 'FS']" \
									-s EXPORT_NAME='createModule' \
									-s USE_ES6_IMPORT_META=0 \
									-s FORCE_FILESYSTEM=1
                  # -s NO_DISABLE_EXCEPTION_CATCHING=1 \
									# -s SAFE_HEAP=1 \
									# -s STACK_OVERFLOW_CHECK=1
									# -s ASSERTIONS=1 

default: wasm
wasm: obj lammps.mjs

lammps.mjs: $(LAMMPS_OBJ_FILES)
	$(CXX) $(SYMBOLS) $(LD_FLAGS) -o $@ $^
	
obj:
	mkdir -p obj

obj/%.o: lammps/src/%.cpp
	$(CXX) $(CC_FLAGS) $(INCLUDE_FLAGS) -c -o $@ $<

clean:
	rm lammps.mjs; rm lammps.wasm; rm obj/*