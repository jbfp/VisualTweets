using System;
using System.Web.Mvc;
using LinqToTwitter;

namespace Chromesthesia.Controllers
{
    public class MvcAuthorizer : WebAuthorizer
    {
        public ActionResult BeginAuthorization()
        {
            return new MvcOAuthActionResult(this);
        }

        public new ActionResult BeginAuthorization(Uri callback)
        {
            Callback = callback;
            return new MvcOAuthActionResult(this);
        }
    }
}