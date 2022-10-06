
import * as THREE from 'three'

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result![1], 16),
    parseInt(result![2], 16),
    parseInt(result![3], 16)
  ]
}

export interface AtomType {
  shortname: string
  fullname: string
  radius: number
  color: THREE.Color
}

export const AtomTypes: AtomType[] = [
  { shortname: "H", fullname: "hydrogen", radius: 1.20, color: new THREE.Color(...hexToRgb("#CCCCCC")) },
  { shortname: "He", fullname: "helium", radius: 1.40, color: new THREE.Color(...hexToRgb("#D9FFFF")) },
  { shortname: "Li", fullname: "lithium", radius: 1.82, color: new THREE.Color(...hexToRgb("#CC80FF")) },
  { shortname: "Be", fullname: "beryllium", radius: 1.53, color: new THREE.Color(...hexToRgb("#C2FF00")) },
  { shortname: "B", fullname: "boron", radius: 1.92, color: new THREE.Color(...hexToRgb("#FFB5B5")) },
  { shortname: "C", fullname: "carbon", radius: 1.70, color: new THREE.Color(...hexToRgb("#505050")) },
  { shortname: "N", fullname: "nitrogen", radius: 1.55, color: new THREE.Color(...hexToRgb("#3050F8")) },
  { shortname: "O", fullname: "oxygen", radius: 1.52, color: new THREE.Color(...hexToRgb("#AA0000")) },
  { shortname: "F", fullname: "fluorine", radius: 1.35, color: new THREE.Color(...hexToRgb("#90E050")) },
  { shortname: "Ne", fullname: "neon", radius: 1.54, color: new THREE.Color(...hexToRgb("#3050F8")) },
  { shortname: "Na", fullname: "sodium", radius: 2.27, color: new THREE.Color(...hexToRgb("#AB5CF2")) },
  { shortname: "Mg", fullname: "magnesium", radius: 1.73, color: new THREE.Color(...hexToRgb("#8AFF00")) },
  { shortname: "Al", fullname: "aluminium", radius: 1.84, color: new THREE.Color(...hexToRgb("#BFA6A6")) },
  { shortname: "Si", fullname: "silicon", radius: 2.27, color: new THREE.Color(...hexToRgb("#F0C8A0")) },
  { shortname: "P", fullname: "phosphorus", radius: 1.80, color: new THREE.Color(...hexToRgb("#FF8000")) },
  { shortname: "S", fullname: "sulfur", radius: 1.80, color: new THREE.Color(...hexToRgb("#FFFF30")) },
  { shortname: "Cl", fullname: "chlorine", radius: 1.75, color: new THREE.Color(...hexToRgb("#1FF01F")) },
  { shortname: "Ar", fullname: "argon", radius: 1.88, color: new THREE.Color(...hexToRgb("#80D1E3")) },
  { shortname: "K", fullname: "potassium", radius: 2.75, color: new THREE.Color(...hexToRgb("#8F40D4")) },
  { shortname: "Ca", fullname: "calcium", radius: 2.31, color: new THREE.Color(...hexToRgb("#3DFF00")) },
  { shortname: "Sc", fullname: "scandium", radius: 2.11, color: new THREE.Color(...hexToRgb("#E6E6E6")) },
  { shortname: "Ti", fullname: "titanium", radius: 2.00, color: new THREE.Color(...hexToRgb("#BFC2C7")) },
  { shortname: "V", fullname: "vanadium", radius: 2.00, color: new THREE.Color(...hexToRgb("#A6A6AB")) },
  { shortname: "Cr", fullname: "chromium", radius: 2.00, color: new THREE.Color(...hexToRgb("#8A99C7")) },
  { shortname: "Mn", fullname: "manganese", radius: 2.00, color: new THREE.Color(...hexToRgb("#9C7AC7")) },
  { shortname: "Fe", fullname: "iron", radius: 2.00, color: new THREE.Color(...hexToRgb("#E06633")) },
  { shortname: "Co", fullname: "cobalt", radius: 2.00, color: new THREE.Color(...hexToRgb("#F090A0")) },
  { shortname: "Ni", fullname: "nickel", radius: 1.63, color: new THREE.Color(...hexToRgb("#50D050")) },
  { shortname: "Cu", fullname: "copper", radius: 1.40, color: new THREE.Color(...hexToRgb("#C88033")) },
  { shortname: "Zn", fullname: "zinc", radius: 1.39, color: new THREE.Color(...hexToRgb("#7D80B0")) },
  { shortname: "Ga", fullname: "gallium", radius: 1.87, color: new THREE.Color(...hexToRgb("#C28F8F")) },
  { shortname: "Ge", fullname: "germanium", radius: 2.11, color: new THREE.Color(...hexToRgb("#668F8F")) },
  { shortname: "As", fullname: "arsenic", radius: 1.85, color: new THREE.Color(...hexToRgb("#BD80E3")) },
  { shortname: "Se", fullname: "selenium", radius: 1.90, color: new THREE.Color(...hexToRgb("#FFA100")) },
  { shortname: "Br", fullname: "bromine", radius: 1.85, color: new THREE.Color(...hexToRgb("#A62929")) },
  { shortname: "Kr", fullname: "krypton", radius: 2.02, color: new THREE.Color(...hexToRgb("#5CB8D1")) },
  { shortname: "Rb", fullname: "rubidium", radius: 3.03, color: new THREE.Color(...hexToRgb("#702EB0")) },
  { shortname: "Sr", fullname: "strontium", radius: 2.49, color: new THREE.Color(...hexToRgb("#00FF00")) },
  { shortname: "Y", fullname: "yttrium", radius: 2.00, color: new THREE.Color(...hexToRgb("#94FFFF")) },
  { shortname: "Zr", fullname: "zirconium", radius: 2.00, color: new THREE.Color(...hexToRgb("#94E0E0")) },
  { shortname: "Nb", fullname: "niobium", radius: 2.00, color: new THREE.Color(...hexToRgb("#73C2C9")) },
  { shortname: "Mo", fullname: "molybdenum", radius: 2.00, color: new THREE.Color(...hexToRgb("#54B5B5")) },
  { shortname: "Tc", fullname: "technetium", radius: 2.00, color: new THREE.Color(...hexToRgb("#3B9E9E")) },
  { shortname: "Ru", fullname: "ruthenium", radius: 2.00, color: new THREE.Color(...hexToRgb("#248F8F")) },
  { shortname: "Rh", fullname: "rhodium", radius: 2.00, color: new THREE.Color(...hexToRgb("#0A7D8C")) },
  { shortname: "Pd", fullname: "palladium", radius: 1.63, color: new THREE.Color(...hexToRgb("#006985")) },
  { shortname: "Ag", fullname: "silver", radius: 1.72, color: new THREE.Color(...hexToRgb("#C0C0C0")) },
  { shortname: "Cd", fullname: "cadmium", radius: 1.58, color: new THREE.Color(...hexToRgb("#FFD98F")) },
  { shortname: "In", fullname: "indium", radius: 1.93, color: new THREE.Color(...hexToRgb("#A67573")) },
  { shortname: "Sn", fullname: "tin", radius: 2.17, color: new THREE.Color(...hexToRgb("#668080")) },
  { shortname: "Sb", fullname: "antimony", radius: 2.06, color: new THREE.Color(...hexToRgb("#9E63B5")) },
  { shortname: "Te", fullname: "tellurium", radius: 2.06, color: new THREE.Color(...hexToRgb("#D47A00")) },
  { shortname: "I", fullname: "iodine", radius: 1.98, color: new THREE.Color(...hexToRgb("#940094")) },
  { shortname: "Xe", fullname: "xenon", radius: 2.16, color: new THREE.Color(...hexToRgb("#429EB0")) },
  { shortname: "Cs", fullname: "caesium", radius: 3.43, color: new THREE.Color(...hexToRgb("#57178F")) },
  { shortname: "Ba", fullname: "barium", radius: 2.68, color: new THREE.Color(...hexToRgb("#00C900")) },
  { shortname: "La", fullname: "lanthanum", radius: 2.00, color: new THREE.Color(...hexToRgb("#70D4FF")) },
  { shortname: "Ce", fullname: "cerium", radius: 2.00, color: new THREE.Color(...hexToRgb("#FFFFC7")) },
  { shortname: "Pr", fullname: "praseodymium", radius: 2.00, color: new THREE.Color(...hexToRgb("#D9FFC7")) },
  { shortname: "Nd", fullname: "neodymium", radius: 2.00, color: new THREE.Color(...hexToRgb("#C7FFC7")) },
  { shortname: "Pm", fullname: "promethium", radius: 2.00, color: new THREE.Color(...hexToRgb("#A3FFC7")) },
  { shortname: "Sm", fullname: "samarium", radius: 2.00, color: new THREE.Color(...hexToRgb("#8FFFC7")) },
  { shortname: "Eu", fullname: "europium", radius: 2.00, color: new THREE.Color(...hexToRgb("#61FFC7")) },
  { shortname: "Gd", fullname: "gadolinium", radius: 2.00, color: new THREE.Color(...hexToRgb("#45FFC7")) },
  { shortname: "Tb", fullname: "terbium", radius: 2.00, color: new THREE.Color(...hexToRgb("#30FFC7")) },
  { shortname: "Dy", fullname: "dysprosium", radius: 2.00, color: new THREE.Color(...hexToRgb("#1FFFC7")) },
  { shortname: "Ho", fullname: "holmium", radius: 2.00, color: new THREE.Color(...hexToRgb("#00FF9C")) },
  { shortname: "Er", fullname: "erbium", radius: 2.00, color: new THREE.Color(...hexToRgb("#00E675")) },
  { shortname: "Tm", fullname: "thulium", radius: 2.00, color: new THREE.Color(...hexToRgb("#00D452")) },
  { shortname: "Yb", fullname: "ytterbium", radius: 2.00, color: new THREE.Color(...hexToRgb("#00BF38")) },
  { shortname: "Lu", fullname: "lutetium", radius: 2.00, color: new THREE.Color(...hexToRgb("#00AB24")) },
  { shortname: "Hf", fullname: "hafnium", radius: 2.00, color: new THREE.Color(...hexToRgb("#4DC2FF")) },
  { shortname: "Ta", fullname: "tantalum", radius: 2.00, color: new THREE.Color(...hexToRgb("#4DA6FF")) },
  { shortname: "W", fullname: "tungsten", radius: 2.00, color: new THREE.Color(...hexToRgb("#2194D6")) }
  ]
