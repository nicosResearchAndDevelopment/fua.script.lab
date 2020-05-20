const test_name = "test.lab.SetMapArray";

const date = () => new Date().toISOString();
let hint   = ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ";
//hint           = "";

module.exports = (parameter) => {

    console.log(`${hint}${test_name} : start`);

    let
        _length = 1000000,
        array,
        _set,
        probe = 43
    ;

    console.time(`array <${_length}>`);
    array = Array.from({'length':_length},() => (probe++));
    console.timeEnd(`array <${_length}>`);

    console.time(`_set <${_length}>`);
    _set = new Set(array);
    console.timeEnd(`_set <${_length}>`);

    probe = 43;

    console.time(`probe <${probe}>`);
    console.log(`${hint}${test_name} : _set.has(${probe}) <${_set.has(probe)}>`);
    console.timeEnd(`probe <${probe}>`);

    return undefined;
};