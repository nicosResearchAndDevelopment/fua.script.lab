const test_name = "test.lab.BigInt";
const date = () => new Date().toISOString();
module.exports = () => {
    let bigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(Number.MAX_SAFE_INTEGER);
    console.log(`${test_name} : bigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(Number.MAX_SAFE_INTEGER) : <${bigInt}>`);
    console.log(`${test_name} : (bigInt + BigInt(1)) = <${bigInt + BigInt(1)}>`);
    console.log(`${test_name} : typeof bigInt = <${typeof bigInt}>`);
    //console.warn(bigInt + 1);
    return undefined;
};