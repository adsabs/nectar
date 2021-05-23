import { NextPage } from 'next';
import React from 'react';

const PaperForm: NextPage = () => {
  return (
    <form className="grid gap-6 grid-cols-6 mx-auto my-4 px-4 py-12 max-w-3xl">
      <div className="col-span-6">Journal Search</div>
      <div className="col-span-6">Reference Query</div>
      <div className="col-span-6">Bibliographic Code Query</div>
    </form>
  );
};

export default PaperForm;
