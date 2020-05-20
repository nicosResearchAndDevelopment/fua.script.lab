const test_name = "test.lab.async";
const date      = () => new Date().toISOString();

const
    EventEmitter = require("events")
;

(async ({'asyncIterable_dop': asyncIterable_dop = true}) => {

    //region asyncIterable
    // > https://thecodebarbarian.com/getting-started-with-async-iterators-in-node-js
    let
        asyncIterable
    ;

    if (asyncIterable_dop) {
        const nums        = [1, 2, 3, 4, 42, 43];
        let
            index         = 0,
            asyncIterator = undefined
        ;
        switch (
            //"nums"
            "continuous"
            ) {
            case "continuous":

                asyncIterator = (() => {

                    class Random extends EventEmitter {

                        constructor({
                                        'on_random': on_random = undefined
                                    }) {

                            super();

                            if (typeof on_random === 'function') {

                                this['on']('random', on_random);
                                (function ({'that': that}) {
                                    let
                                        random_semaphore = null
                                    ;

                                    function random(that, sleep) {
                                        //console.log(`${test_name} : random : sleep  <${sleep}>`);
                                        if (random_semaphore)
                                            clearTimeout(random_semaphore);
                                        that['emit']('random', Math.random());
                                        random_semaphore = setTimeout(() => {
                                                random(that, (Math.random() * 10) * 100);
                                            }, // fn
                                            parseInt(/** second, time */ sleep)
                                        );
                                    } // random
                                    random_semaphore = random(that, 500);
                                })({'that': this})
                            } // if ()

                        } // constructor

                        get cursor() {
                            return {
                                'next': () => {
                                        return new Promise((resolve, reject) => {
                                            try {
                                                let
                                                    value = Math.random()
                                                ;
                                                //resolve((((value > 0.1) || (value < 0.9)) ? value : null));
                                                function run (resolver) {
                                                    console.log(`${test_name} : setTimeout : ts :  <${(Date.now() / 1000)}>`);
                                                    resolver(value);
                                                }

                                                let _semaphore = setTimeout(run, (value * 100), resolve);
                                            } catch (jex) {
                                                reject(jex);
                                            } // try
                                        }); // return nP
                                    //return new Promise((resolve, reject) => {
                                    //    try {
                                    //        let
                                    //            value = Math.random()
                                    //        ;
                                    //        //resolve((((value > 0.1) || (value < 0.9)) ? value : null));
                                    //        resolve(value);
                                    //    } catch (jex) {
                                    //        reject(jex);
                                    //    } // try
                                    //}); // return nP
                                } // next
                            }; // return
                        } // get cursor

                    } // Random

                    const random = new Random({
                        'on_random': (value) => {
                            //console.log(`${test_name} : random.on('random') : callback : value <${value}>`);
                        }
                    });

                    return {
                        'next': () => random.cursor.next().then((value) => {
                            return {value, 'done': (value === null)};
                            //return {value, 'done': (value !== null)};
                        }).catch((err) => {
                           err;
                        })
                    }; // return
                })();
                break; // continuous
            case "nums":
            default:
                asyncIterator = {
                    'next': () => {
                        if (index >= nums.length) {
                            // A conventional iterator would return a `{ done: true }`
                            // object. An async iterator returns a promise that resolves
                            // to `{ done: true }`
                            return Promise.resolve({'done': true});
                        }
                        const value = nums[index++];
                        //return Promise.resolve({value, 'done': false});
                        return Promise.resolve({value, 'done': (value === 43)});
                    } // next
                };
                break; // default / nums
        } // switch()

        asyncIterable = {
            [Symbol.asyncIterator]: () => asyncIterator
        };
    } // if (dop)
    //region asyncIterable

    async function main({'nounce': nounce}) {

        try {
            //throw new Error();
            //region asyncIterable
            if (asyncIterable_dop) {

                const {next} = asyncIterable[Symbol.asyncIterator]();

                // Use a `for` loop with `await` to exhaust the iterable. Once
                // `next()` resolves to a promise with `done: true`, exit the
                // loop.
                if (false) {
                    //for (let {value, done} = await next(); !done; {value, done} = await next()) {
                    for (let {value, done} = await next(); !done; {value, done} = await (() => {
                        return next();
                    })()) {
                        console.log(`${test_name} : asyncIterable : value <${value}>`);
                    } // for (!done)
                } else if (true) {
                    for (let {value, done} = await next(); !!((!done) ? true : (({}) => {
                        //result['ts'] = (Date.now() / 1000);
                        //throw new Error();
                        //resolve({});
                        return Promise.reject({'done': done, 'ts': (Date.now() / 1000)});
                        //return Promise.resolve({'done': done, 'ts': (Date.now() / 1000)});
                    })({})); {value, done} = await next()) {
                        console.log(`${test_name} : asyncIterable : value <${value}>`);
                    } // for (!done)
                } else {
                    // Use for/await/of to loop through the async iterable
                    for await (const value of asyncIterable) {
                        // Prints "Enter the Dragon', "Ip Man", "Kickboxer"
                        //console.log(doc.name);
                        console.log(`${test_name} : asyncIterable : value <${value}>`);
                    } // for await
                } // if (shield)
            } // if (dop)
            //endregion asyncIterable
            //} catch (jex) {
            //    return Promise.reject(jex);
            ////    throw jex;
        } finally {
            return new Promise((resolve, reject) => {
                let result = {
                    'nounce': nounce
                };
                try {
                    result['ts'] = (Date.now() / 1000);
                    //throw new Error(); // REM  >>> goes local catch(jex) !!!
                    //reject(new Error());
                    resolve(result);
                } catch (jex) {
                    reject({'nounce': nounce, 'ts': (Date.now() / 1000), 'err': jex});
                } // try
            }); // return nP
        } // try
    } // main

    if (false) {
        try {
            let result = await main({'nounce': Math.random()});
            console.log(`${test_name} : main.result: <\n${JSON.stringify(result, null, "\t")}\n>`);
        } catch (err) {
            console.warn(`test_name : err: <`);
            console.warn(err);
            console.warn(`>`);
        } //
    } else if (true) {
        main({'nounce': Math.random()}).then((result) => {
            console.log(`${test_name} : main_result: <\n${JSON.stringify(result, null, "\t")}\n>`);
        }).catch((err) => {
            console.warn(`test_name : main.catch(err) : <`);
            console.warn(err);
            console.warn(`>`);
        });

    } // ifs()

})({});
