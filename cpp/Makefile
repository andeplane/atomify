CXX = emcc
MAXMEMORY = 512MB

LAMMPS_SOURCE := $(wildcard lammps/src/*.cpp)
LAMMPS_OBJ_FILES := $(addprefix obj/,$(notdir $(LAMMPS_SOURCE:.cpp=.o)))

LD_FLAGS := -O2
CC_FLAGS := -O2 -DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL
INCLUDE_FLAGS := -Ilammps/src
# SYMBOLS := -s EXPORT_ES6=1 -s MODULARIZE=1 -s LLD_REPORT_UNDEFINED -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s ASSERTIONS=2 -s RESERVED_FUNCTION_POINTERS=1 -s NO_EXIT_RUNTIME=1 -s DISABLE_EXCEPTION_CATCHING=0 -s TOTAL_MEMORY=$(MAXMEMORY) -s EXPORTED_FUNCTIONS="['_runCommands', '_addAtomifyFix', '_numberOfAtoms', '_setCallback', '_reset', '_runDefaultScript', '_systemSizeX', '_systemSizeY', '_systemSizeZ', '_positions', '_x', '_v', '_f', '_active', '_lammps_command', '_lammps_commands_string', '_lammps_extract_setting', '_lammps_get_natoms', '_lammps_extract_global', '_lammps_extract_atom', '_lammps_extract_compute', '_lammps_extract_fix', '_lammps_extract_variable', '_lammps_set_variable', '_lammps_get_thermo', '_lammps_has_error', '_lammps_get_last_error_message']"
SYMBOLS := --bind -s NO_DISABLE_EXCEPTION_CATCHING -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXTRA_EXPORTED_RUNTIME_METHODS="['getValue']"
default: wasm
wasm: obj lammps.js

lammps.js: $(LAMMPS_OBJ_FILES)
	$(CXX) $(SYMBOLS) $(LD_FLAGS) -o $@ $^
	
obj:
	mkdir -p obj

obj/%.o: lammps/src/%.cpp
	$(CXX) $(SYMBOLS) $(CC_FLAGS) $(INCLUDE_FLAGS) -c -o $@ $<

clean:
	rm lammps.js; rm lammps.wasm; rm obj/*