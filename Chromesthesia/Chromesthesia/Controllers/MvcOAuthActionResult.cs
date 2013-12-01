using System.Web;
using System.Web.Mvc;
using LinqToTwitter;

namespace Chromesthesia.Controllers
{
    public class MvcOAuthActionResult : ActionResult
    {
        private readonly WebAuthorizer _webAuth;

        public MvcOAuthActionResult(WebAuthorizer webAuth)
        {
            _webAuth = webAuth;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            _webAuth.PerformRedirect = authUrl => HttpContext.Current.Response.Redirect(authUrl);
            var callback = _webAuth.Callback ?? HttpContext.Current.Request.Url;
            _webAuth.BeginAuthorization(callback);
        }
    }
}