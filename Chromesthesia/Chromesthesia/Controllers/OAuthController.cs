using System;
using System.Configuration;
using System.Web.Mvc;
using LinqToTwitter;

namespace Chromesthesia.Controllers
{
    [RequireHttps]
    [RoutePrefix("OAuth")]
    public class OAuthController : Controller
    {
        [HttpGet]
        [Route("BeginAuthorization/{query?}")]
        public ActionResult BeginAuthorization(string query)
        {
            var authorizer = new MvcAuthorizer
            {
                Credentials = new SessionStateCredentials
                {
                    ConsumerKey = ConfigurationManager.AppSettings["ConsumerKey"],
                    ConsumerSecret = ConfigurationManager.AppSettings["ConsumerSecret"]
                }
            };

            var url = Url.Action("CompleteAuthorization", "OAuth", new {query}, Uri.UriSchemeHttps);
            var callback = new Uri(url);
            return authorizer.IsAuthorized
                       ? RedirectToAction("CompleteAuthorization")
                       : authorizer.BeginAuthorization(callback);
        }

        [HttpGet]
        [Route("CompleteAuthorization/{query?}")]
        public ActionResult CompleteAuthorization(string query)
        {
            var authorizer = new MvcAuthorizer {Credentials = new SessionStateCredentials()};
            if (authorizer.CompleteAuthorization(Request.Url))
            {
                return RedirectToAction("Index", "Twitter", new {query});
            }
            return View("Error");
        }
    }
}
