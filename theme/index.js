const fs = require('fs');
const handlebars = require('handlebars');
const handlebarsWax = require('handlebars-wax');
const { Temporal } = require('temporal-polyfill');
const Swag = require('swag');

try {
  window.Swag.registerHelpers(handlebars);
} catch (e) {
  Swag.registerHelpers(handlebars);
}

const cal = new Intl.DateTimeFormat().resolvedOptions().calendar;
const pd = Temporal.PlainDate.from;
const today = Temporal.Now.plainDate(cal);

handlebars.registerHelper({
  removeProtocol: url => url.replace(/.*?:\/\//g, ''),
  concat: (...args) => args.filter(arg => typeof arg !== 'object').join(''),
  // Arguments: {address, city, subdivision, postalCode, countryCode}
  formatAddress: (...args) => args.filter(arg => typeof arg !== 'object').join(' '),
  formatDate: date => pd(date).toLocaleString('', { year: 'numeric', month: 'short' }),
  getTotalExperience: work =>
    [
      work
        .map(({ startDate: sd, endDate: ed }) =>
          pd(sd)
            .withCalendar(cal)
            .until(pd(ed).withCalendar(cal) ?? Temporal.Now.plainDate(cal), { largestUnit: `year` }),
        )
        .reduce((a, c) => a.add(c, { relativeTo: today })),
    ].map(
      x =>
        `${x.years > 0 ? `${x.years} year${x.years > 1 ? 's' : ''} ` : ''}${x.months} month${x.months > 1 ? 's' : ''}`,
    ),
});

function render(resume) {
  const dir = `${__dirname}/src`;
  const css = fs.readFileSync(`${dir}/style.css`, 'utf-8');
  const resumeTemplate = fs.readFileSync(`${dir}/resume.hbs`, 'utf-8');

  const Handlebars = handlebarsWax(handlebars);

  Handlebars.partials(`${dir}/partials/**/*.{hbs,js}`);

  return Handlebars.compile(resumeTemplate)({
    style: `<style>${css}</style>`,
    resume,
  });
}

const marginValue = '0.8 cm';
const pdfRenderOptions = {
  margin: {
    top: marginValue,
    bottom: marginValue,
    left: marginValue,
    right: marginValue,
  },
};

module.exports = {
  render,
  pdfRenderOptions,
};
